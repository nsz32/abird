; Custom NSIS script for Bird uninstaller
; Offers to clean all user data (config, partitions, shortcuts) on uninstall

; Cleanup prompt translations (LCID codes required for electron-builder NSIS)
LangString cleanupPrompt 1033 "Do you want to remove all Bird data (configuration, partitions, shortcuts)?"              ; English
LangString cleanupPrompt 1036 "Voulez-vous supprimer toutes les données de Bird (configuration, partitions, raccourcis) ?" ; French
LangString cleanupPrompt 1031 "Möchten Sie alle Bird-Daten löschen (Konfiguration, Partitionen, Verknüpfungen)?"           ; German
LangString cleanupPrompt 1034 "¿Desea eliminar todos los datos de Bird (configuración, particiones, accesos directos)?"    ; Spanish
LangString cleanupPrompt 1040 "Vuoi rimuovere tutti i dati di Bird (configurazione, partizioni, collegamenti)?"            ; Italian
LangString cleanupPrompt 1046 "Deseja remover todos os dados do Bird (configuração, partições, atalhos)?"                  ; Portuguese (Brazil)
LangString cleanupPrompt 1049 "Вы хотите удалить все данные Bird (конфигурацию, разделы, ярлыки)?"                         ; Russian
LangString cleanupPrompt 2052 "您要删除所有 Bird 数据（配置、分区、快捷方式）吗？"                                            ; Simplified Chinese
; Note: Arabic (1025) and Hindi (1081) not supported by NSIS MUI - falls back to English

!macro customUnInit
  ; Skip cleanup prompt during updates (silent reinstall)
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "$(cleanupPrompt)" \
      /SD IDYES \
      IDNO skip_cleanup

    ; Run cleanup before files are deleted
    nsExec::ExecToLog '"$INSTDIR\Bird.exe" --cleanall --force'

    skip_cleanup:
  ${endIf}
!macroend
