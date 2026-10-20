package com.salarytracker.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.EditText;

public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView v, String url, String msg, JsResult r) {
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(msg)
                    .setPositiveButton("حسنًا", (d, i) -> r.confirm())
                    .setOnCancelListener(d -> r.cancel())
                    .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView v, String url, String msg, JsResult r) {
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(msg)
                    .setPositiveButton("نعم", (d, i) -> r.confirm())
                    .setNegativeButton("لا", (d, i) -> r.cancel())
                    .setOnCancelListener(d -> r.cancel())
                    .show();
                return true;
            }

            @Override
            public boolean onJsPrompt(WebView v, String url, String msg, String def, JsPromptResult r) {
                EditText et = new EditText(MainActivity.this);
                if (def != null) et.setText(def);
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(msg)
                    .setView(et)
                    .setPositiveButton("موافق", (d, i) -> r.confirm(et.getText().toString()))
                    .setNegativeButton("إلغاء", (d, i) -> r.cancel())
                    .setOnCancelListener(d -> r.cancel())
                    .show();
                return true;
            }
        });
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        finish();
    }
}
