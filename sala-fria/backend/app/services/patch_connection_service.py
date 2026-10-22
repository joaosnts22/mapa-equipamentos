from datetime import datetime
import json

from sqlalchemy import (
    delete,
    func,
    select,
)

from models.entities import (
    Equipamento,
    Historico,
    PatchConnection,
    PatchConnectionEndpoint,
    PatchPosition,
    Rack,
)


class PatchConnectionNotFoundError(
    Exception
):
    pass


class PatchConnectionConflictError(
    Exception
):
    pass


class PatchConnectionValidationError(
    Exception
):
    pass


class PatchConnectionEquipmentError(
    Exception
):
    pass


def validate_connector(
    connector,
):
    if connector not in (
        "entrada",
        "saida",
    ):
        raise PatchConnectionValidationError(
            "O conector deve ser "
            "'entrada' ou 'saida'."
        )


def validate_position_number(
    position_number,
):
    if (
        not isinstance(
            position_number,
            int,
        )
        or position_number < 1
        or position_number > 32
    ):
        raise PatchConnectionValidationError(
            "A posicao deve estar "
            "entre 1 e 32."
        )


def get_patch_equipment(
    session,
    equipment_id,
):
    equipment = session.scalar(
        select(Equipamento).where(
            Equipamento.id
            == equipment_id,
            Equipamento.visivel.is_(
                True
            ),
        )
    )

    if equipment is None:
        raise PatchConnectionEquipmentError(
            "Equipamento com ID "
            + str(equipment_id)
            + " nao encontrado "
            + "ou nao esta visivel."
        )

    if not equipment.is_patch:
        raise PatchConnectionEquipmentError(
            "O equipamento "
            + equipment.nome
            + " nao esta classificado "
            + "como patch."
        )

    return equipment


def get_equipment_rack(
    session,
    equipment,
):
    rack = session.scalar(
        select(Rack).where(
            Rack.rack_key
            == equipment.rack_key
        )
    )

    if rack is None:
        raise PatchConnectionEquipmentError(
            "A fileira do equipamento "
            + equipment.nome
            + " nao foi encontrado."
        )

    return rack


def get_connector_name(
    session,
    equipment_key,
    position_number,
    connector,
):
    position = session.scalar(
        select(PatchPosition).where(
            PatchPosition.equipamento_key
            == equipment_key,
            PatchPosition.numero_posicao
            == position_number,
        )
    )

    if position is None:
        return None

    if connector == "entrada":
        return position.nome_entrada

    return position.nome_saida


def endpoint_identity(
    equipment_key,
    position_number,
    connector,
):
    return (
        str(equipment_key),
        int(position_number),
        str(connector),
    )


def endpoint_to_dict(
    session,
    endpoint,
):
    equipment = session.scalar(
        select(Equipamento).where(
            Equipamento.equipamento_key
            == endpoint.equipamento_key
        )
    )

    if equipment is None:
        raise PatchConnectionEquipmentError(
            "O equipamento da ponta "
            + "da conexao nao foi encontrado."
        )

    rack = get_equipment_rack(
        session,
        equipment,
    )

    return {
        "equipamento_id":
            equipment.id,
        "equipamento_key":
            equipment.equipamento_key,
        "equipamento_nome":
            equipment.nome,
        "rack_key":
            rack.rack_key,
        "rack_nome": (
            rack.display_name
            or rack.rack_key
        ),
        "numero_posicao":
            endpoint.numero_posicao,
        "conector":
            endpoint.conector,
        "nome_conector":
            get_connector_name(
                session=session,
                equipment_key=(
                    equipment
                    .equipamento_key
                ),
                position_number=(
                    endpoint
                    .numero_posicao
                ),
                connector=(
                    endpoint.conector
                ),
            ),
    }


def get_connection_endpoints(
    session,
    connection_id,
):
    endpoints = list(
        session.scalars(
            select(
                PatchConnectionEndpoint
            )
            .where(
                PatchConnectionEndpoint
                .conexao_id
                == connection_id
            )
            .order_by(
                PatchConnectionEndpoint
                .ordem_ponta
            )
        ).all()
    )

    if len(endpoints) != 2:
        raise PatchConnectionConflictError(
            "A conexao "
            + str(connection_id)
            + " nao possui exatamente "
            + "duas pontas."
        )

    return endpoints


def get_connection_by_id(
    session,
    connection_id,
):
    connection = session.scalar(
        select(PatchConnection).where(
            PatchConnection.id
            == connection_id
        )
    )

    if connection is None:
        raise PatchConnectionNotFoundError(
            "Conexao com ID "
            + str(connection_id)
            + " nao encontrada."
        )

    return connection


def find_endpoint(
    session,
    equipment_key,
    position_number,
    connector,
):
    return session.scalar(
        select(
            PatchConnectionEndpoint
        ).where(
            PatchConnectionEndpoint
            .equipamento_key
            == equipment_key,
            PatchConnectionEndpoint
            .numero_posicao
            == position_number,
            PatchConnectionEndpoint
            .conector
            == connector,
        )
    )


def connection_to_dict(
    session,
    connection,
    current_endpoint=None,
):
    endpoints = (
        get_connection_endpoints(
            session,
            connection.id,
        )
    )

    if current_endpoint is None:
        current_endpoint = endpoints[0]

    current_identity = endpoint_identity(
        current_endpoint.equipamento_key,
        current_endpoint.numero_posicao,
        current_endpoint.conector,
    )

    endpoint_one_identity = (
        endpoint_identity(
            endpoints[0].equipamento_key,
            endpoints[0].numero_posicao,
            endpoints[0].conector,
        )
    )

    if (
        current_identity
        == endpoint_one_identity
    ):
        current = endpoints[0]
        remote = endpoints[1]

    else:
        current = endpoints[1]
        remote = endpoints[0]

    return {
        "id":
            connection.id,
        "versao_dados":
            connection.versao_dados,
        "ponta_atual":
            endpoint_to_dict(
                session,
                current,
            ),
        "ponta_remota":
            endpoint_to_dict(
                session,
                remote,
            ),
        "criado_em":
            connection.criado_em,
        "atualizado_em":
            connection.atualizado_em,
    }


def make_endpoint_history_data(
    session,
    endpoint,
):
    return endpoint_to_dict(
        session,
        endpoint,
    )


def register_connection_history(
    session,
    action,
    user,
    connection_id,
    old_data=None,
    new_data=None,
):
    history = Historico(
        tipo_entidade=(
            "conexao_patch"
        ),
        entidade_key=(
            "PATCH-CONNECTION-"
            + str(connection_id)
        ),
        acao=action,
        dados_anteriores=(
            json.dumps(
                old_data,
                ensure_ascii=False,
                sort_keys=True,
                default=str,
            )
            if old_data is not None
            else None
        ),
        dados_novos=(
            json.dumps(
                new_data,
                ensure_ascii=False,
                sort_keys=True,
                default=str,
            )
            if new_data is not None
            else None
        ),
        usuario=user,
        data_operacao=datetime.now(),
    )

    session.add(
        history
    )


def search_patch_equipments(
    session,
    query,
    limit=20,
):
    normalized_query = str(
        query or ""
    ).strip()

    statement = (
        select(
            Equipamento,
            Rack,
        )
        .join(
            Rack,
            Rack.rack_key
            == Equipamento.rack_key,
        )
        .where(
            Equipamento.is_patch.is_(
                True
            ),
            Equipamento.visivel.is_(
                True
            ),
            Rack.visivel.is_(
                True
            ),
        )
        .order_by(
            Equipamento.nome,
            Rack.display_name,
            Equipamento.id,
        )
        .limit(
            max(
                1,
                min(
                    int(limit or 20),
                    50,
                ),
            )
        )
    )

    if normalized_query:
        search_pattern = (
            "%"
            + normalized_query.lower()
            + "%"
        )

        statement = statement.where(
            func.lower(
                Equipamento.nome
            ).like(
                search_pattern
            )
        )

    rows = list(
        session.execute(
            statement
        ).all()
    )

    return {
        "resultados": [
            {
                "equipamento_id":
                    equipment.id,
                "equipamento_key":
                    equipment
                    .equipamento_key,
                "equipamento_nome":
                    equipment.nome,
                "rack_key":
                    rack.rack_key,
                "rack_nome": (
                    rack.display_name
                    or rack.rack_key
                ),
                "quantidade_posicoes":
                    32,
            }
            for equipment, rack
            in rows
        ]
    }


def get_endpoint_connection(
    session,
    equipment_id,
    position_number,
    connector,
):
    validate_position_number(
        position_number
    )

    validate_connector(
        connector
    )

    equipment = get_patch_equipment(
        session,
        equipment_id,
    )

    endpoint = find_endpoint(
        session=session,
        equipment_key=(
            equipment.equipamento_key
        ),
        position_number=(
            position_number
        ),
        connector=connector,
    )

    if endpoint is None:
        return {
            "conectado": False,
            "conexao": None,
        }

    connection = get_connection_by_id(
        session,
        endpoint.conexao_id,
    )

    return {
        "conectado": True,
        "conexao":
            connection_to_dict(
                session=session,
                connection=connection,
                current_endpoint=endpoint,
            ),
    }


def connection_matches_endpoints(
    session,
    connection_id,
    first_identity,
    second_identity,
):
    endpoints = (
        get_connection_endpoints(
            session,
            connection_id,
        )
    )

    identities = {
        endpoint_identity(
            endpoint.equipamento_key,
            endpoint.numero_posicao,
            endpoint.conector,
        )
        for endpoint in endpoints
    }

    return identities == {
        first_identity,
        second_identity,
    }


def delete_connection_internal(
    session,
    connection_id,
    user,
    register_history=True,
):
    connection = get_connection_by_id(
        session,
        connection_id,
    )

    endpoints = (
        get_connection_endpoints(
            session,
            connection.id,
        )
    )

    old_data = {
        "id":
            connection.id,
        "versao_dados":
            connection.versao_dados,
        "pontas": [
            make_endpoint_history_data(
                session,
                endpoint,
            )
            for endpoint in endpoints
        ],
        "criado_em":
            connection.criado_em,
        "atualizado_em":
            connection.atualizado_em,
    }

    if register_history:
        register_connection_history(
            session=session,
            action=(
                "remocao_conexao_patch"
            ),
            user=user,
            connection_id=(
                connection.id
            ),
            old_data=old_data,
            new_data=None,
        )

    session.execute(
        delete(
            PatchConnectionEndpoint
        ).where(
            PatchConnectionEndpoint
            .conexao_id
            == connection.id
        )
    )

    session.execute(
        delete(
            PatchConnection
        ).where(
            PatchConnection.id
            == connection.id
        )
    )

    session.flush()

    return old_data


def create_patch_connection(
    session,
    payload,
    user,
):
    current_input = (
        payload.ponta_atual
    )

    destination_input = (
        payload.ponta_destino
    )

    validate_position_number(
        current_input.numero_posicao
    )

    validate_position_number(
        destination_input.numero_posicao
    )

    validate_connector(
        current_input.conector
    )

    validate_connector(
        destination_input.conector
    )

    current_equipment = (
        get_patch_equipment(
            session,
            current_input.equipamento_id,
        )
    )

    destination_equipment = (
        get_patch_equipment(
            session,
            destination_input
            .equipamento_id,
        )
    )

    current_identity = (
        endpoint_identity(
            current_equipment
            .equipamento_key,
            current_input.numero_posicao,
            current_input.conector,
        )
    )

    destination_identity = (
        endpoint_identity(
            destination_equipment
            .equipamento_key,
            destination_input
            .numero_posicao,
            destination_input.conector,
        )
    )

    if (
        current_identity
        == destination_identity
    ):
        raise PatchConnectionValidationError(
            "Uma ponta nao pode ser "
            "conectada nela mesma."
        )

    current_existing = find_endpoint(
        session=session,
        equipment_key=(
            current_equipment
            .equipamento_key
        ),
        position_number=(
            current_input.numero_posicao
        ),
        connector=(
            current_input.conector
        ),
    )

    destination_existing = (
        find_endpoint(
            session=session,
            equipment_key=(
                destination_equipment
                .equipamento_key
            ),
            position_number=(
                destination_input
                .numero_posicao
            ),
            connector=(
                destination_input
                .conector
            ),
        )
    )

    existing_connection_ids = {
        endpoint.conexao_id
        for endpoint in (
            current_existing,
            destination_existing,
        )
        if endpoint is not None
    }

    if (
        len(existing_connection_ids)
        == 1
    ):
        existing_connection_id = next(
            iter(
                existing_connection_ids
            )
        )

        if connection_matches_endpoints(
            session=session,
            connection_id=(
                existing_connection_id
            ),
            first_identity=(
                current_identity
            ),
            second_identity=(
                destination_identity
            ),
        ):
            connection = (
                get_connection_by_id(
                    session,
                    existing_connection_id,
                )
            )

            current_endpoint = (
                find_endpoint(
                    session=session,
                    equipment_key=(
                        current_equipment
                        .equipamento_key
                    ),
                    position_number=(
                        current_input
                        .numero_posicao
                    ),
                    connector=(
                        current_input
                        .conector
                    ),
                )
            )

            return connection_to_dict(
                session=session,
                connection=connection,
                current_endpoint=(
                    current_endpoint
                ),
            )

    if (
        existing_connection_ids
        and not payload
        .substituir_existentes
    ):
        raise PatchConnectionConflictError(
            "Uma das pontas ja esta "
            "conectada. Confirme a "
            "substituicao para continuar."
        )

    if payload.substituir_existentes:
        for connection_id in (
            sorted(
                existing_connection_ids
            )
        ):
            delete_connection_internal(
                session=session,
                connection_id=(
                    connection_id
                ),
                user=user,
                register_history=True,
            )

    current_time = datetime.now()

    connection = PatchConnection(
        versao_dados=1,
        criado_em=current_time,
        atualizado_em=current_time,
    )

    session.add(
        connection
    )

    session.flush()

    endpoint_one = (
        PatchConnectionEndpoint(
            conexao_id=connection.id,
            ordem_ponta=1,
            equipamento_key=(
                current_equipment
                .equipamento_key
            ),
            numero_posicao=(
                current_input
                .numero_posicao
            ),
            conector=(
                current_input.conector
            ),
        )
    )

    endpoint_two = (
        PatchConnectionEndpoint(
            conexao_id=connection.id,
            ordem_ponta=2,
            equipamento_key=(
                destination_equipment
                .equipamento_key
            ),
            numero_posicao=(
                destination_input
                .numero_posicao
            ),
            conector=(
                destination_input
                .conector
            ),
        )
    )

    session.add_all(
        [
            endpoint_one,
            endpoint_two,
        ]
    )

    session.flush()

    result = connection_to_dict(
        session=session,
        connection=connection,
        current_endpoint=(
            endpoint_one
        ),
    )

    register_connection_history(
        session=session,
        action=(
            "criacao_conexao_patch"
        ),
        user=user,
        connection_id=connection.id,
        old_data=None,
        new_data=result,
    )

    return result


def delete_patch_connection(
    session,
    connection_id,
    expected_version,
    user,
):
    connection = get_connection_by_id(
        session,
        connection_id,
    )

    if (
        int(connection.versao_dados)
        != int(expected_version)
    ):
        raise PatchConnectionConflictError(
            "A conexao foi alterada "
            "por outra sessao. "
            "Versao recebida: "
            + str(expected_version)
            + ". Versao atual: "
            + str(
                connection.versao_dados
            )
            + "."
        )

    delete_connection_internal(
        session=session,
        connection_id=(
            connection.id
        ),
        user=user,
        register_history=True,
    )

    return {
        "removida": True,
        "conexao_id":
            connection_id,
        "mensagem": (
            "Conexao removida "
            "das duas pontas."
        ),
    }


def search_patch_endpoints(
    session,
    query,
    current_connector,
    current_equipment_id=None,
    current_position_number=None,
    limit=50,
):
    validate_connector(
        current_connector
    )

    normalized_query = str(
        query or ""
    ).strip()

    if current_connector == "entrada":
        destination_connector = "saida"
        name_column = (
            PatchPosition.nome_saida
        )

    else:
        destination_connector = "entrada"
        name_column = (
            PatchPosition.nome_entrada
        )

    statement = (
        select(
            PatchPosition,
            Equipamento,
            Rack,
        )
        .join(
            Equipamento,
            Equipamento.equipamento_key
            == PatchPosition.equipamento_key,
        )
        .join(
            Rack,
            Rack.rack_key
            == Equipamento.rack_key,
        )
        .where(
            Equipamento.is_patch.is_(
                True
            ),
            Equipamento.visivel.is_(
                True
            ),
            Rack.visivel.is_(
                True
            ),
            name_column.is_not(
                None
            ),
            func.trim(
                name_column
            ) != "",
        )
        .order_by(
            func.lower(
                name_column
            ),
            Equipamento.nome,
            PatchPosition.numero_posicao,
        )
        .limit(
            max(
                1,
                min(
                    int(limit or 50),
                    100,
                ),
            )
        )
    )

    if normalized_query:
        search_pattern = (
            "%"
            + normalized_query.lower()
            + "%"
        )

        statement = statement.where(
            func.lower(
                name_column
            ).like(
                search_pattern
            )
        )

    rows = list(
        session.execute(
            statement
        ).all()
    )

    results = []

    for (
        position,
        equipment,
        rack,
    ) in rows:
        connector_name = (
            position.nome_saida
            if destination_connector
            == "saida"
            else position.nome_entrada
        )

        same_physical_endpoint = (
            current_equipment_id
            is not None
            and current_position_number
            is not None
            and int(
                equipment.id
            )
            == int(
                current_equipment_id
            )
            and int(
                position.numero_posicao
            )
            == int(
                current_position_number
            )
            and destination_connector
            == current_connector
        )

        if same_physical_endpoint:
            continue

        results.append(
            {
                "equipamento_id":
                    equipment.id,
                "equipamento_key":
                    equipment
                    .equipamento_key,
                "equipamento_nome":
                    equipment.nome,
                "rack_key":
                    rack.rack_key,
                "rack_nome": (
                    rack.display_name
                    or rack.rack_key
                ),
                "numero_posicao":
                    position
                    .numero_posicao,
                "conector":
                    destination_connector,
                "nome_conector":
                    connector_name,
            }
        )

    return {
        "conector_pesquisado":
            destination_connector,
        "resultados":
            results,
    }

