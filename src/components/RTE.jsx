import React, { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Controller } from "react-hook-form";
import "./RTE.css"
import conf from "../conf/conf";
import { useAskContext } from "../context/AskContext";

const RTE = ({
  name,
  control,
  defaultValue = "",
}) => {

  const {
    setnotificationPopMsg,
    setNotificationPopMsgNature } = useAskContext()

  return (
    <div className="w-full">
      <Controller
        name={name || "content"}
        control={control}
        render={({ field: { onChange } }) => (
          <Editor
            apiKey={conf.tinyMCEapiKey}
            initialValue={defaultValue}
            init={{
              initialValue: defaultValue,
              height: 500,
              autoresize_max_height: 800,
              menubar: false,
              plugins: ["lists", "image", "wordcount"],
              toolbar:
                "undo redo | image | bold italic forecolor backcolor  | alignleft aligncenter alignright alignjustify | outdent indent |removeformat",
              content_style:
                "body { font-family:Helvetica,Arial,sans-serif; font-size:18px }",
              file_picker_callback: function (callback, value, meta) {
                if (meta.filetype === "image") {
                  const editor = tinymce.activeEditor;
                  editor.selection.select(editor.getBody(), true);
                  editor.selection.collapse(false);
                  // Trigger a click on the input element for file selection
                  const input = document.createElement("input");
                  input.setAttribute("type", "file");
                  input.setAttribute("accept", "image/*");
                  input.onchange = function (e) {
                    const file = input.files[0];
                    const MAX_FILE_SIZE = 1 * 1024 * 1024;
                    if (file.size > MAX_FILE_SIZE) {
                      setNotificationPopMsgNature((prev) => false)
                      setnotificationPopMsg((prev) => "Image Must be Less then and Equal to 1 MB")
                      return
                    }
                    const reader = new FileReader();
                    reader.onload = function () {
                      callback(reader.result, {
                        alt: file.name,
                        width: "400px",
                        height: "250px",
                      });
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }
              },

            }}
            onEditorChange={(content) => {
              onChange(content);
            }}
          />
        )}
      />
    </div>
  );
};

export default RTE;
