' Inicia iniciar_servidor.cmd sem abrir janela (para o Agendador de Tarefas ou Win+R).
Set shell = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
shell.Run """" & folder & "\iniciar_servidor.cmd""", 0, False
