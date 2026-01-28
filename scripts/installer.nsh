; Custom NSIS script for ABird uninstaller
; Offers to clean all user data (config, partitions, shortcuts) on uninstall

; Cleanup prompt translations (LCID codes required for electron-builder NSIS)
LangString cleanupPrompt 1033 "Do you want to remove all ABird data (configuration, partitions, shortcuts)?"              ; English
LangString cleanupPrompt 1036 "Voulez-vous supprimer toutes les données de ABird (configuration, partitions, raccourcis) ?" ; French
LangString cleanupPrompt 1031 "Möchten Sie alle ABird-Daten löschen (Konfiguration, Partitionen, Verknüpfungen)?"           ; German
LangString cleanupPrompt 1034 "¿Desea eliminar todos los datos de ABird (configuración, particiones, accesos directos)?"    ; Spanish
LangString cleanupPrompt 1040 "Vuoi rimuovere tutti i dati di ABird (configurazione, partizioni, collegamenti)?"            ; Italian
LangString cleanupPrompt 1046 "Deseja remover todos os dados do ABird (configuração, partições, atalhos)?"                  ; Portuguese (Brazil)
LangString cleanupPrompt 1049 "Вы хотите удалить все данные ABird (конфигурацию, разделы, ярлыки)?"                         ; Russian
LangString cleanupPrompt 2052 "您要删除所有 ABird 数据（配置、分区、快捷方式）吗？"                                            ; Simplified Chinese
; Note: Arabic (1025) and Hindi (1081) not supported by NSIS MUI - falls back to English

!macro customUnInit
  ; Skip cleanup prompt during updates (silent reinstall)
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "$(cleanupPrompt)" \
      /SD IDYES \
      IDNO skip_cleanup

    ; Run cleanup before files are deleted
    nsExec::ExecToLog '"$INSTDIR\ABird.exe" --cleanall --force'

    skip_cleanup:
  ${endIf}
!macroend
