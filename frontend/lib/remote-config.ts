"use client";
import { useEffect, useState } from "react";
import { getRemoteConfig, getValue } from "firebase/remote-config";
import { app, initRemoteConfig } from "@/lib/firebase";

export const useRemoteConfig = (key: string, defaultValue: string | number | boolean) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (typeof window !== "undefined") {
            initRemoteConfig().then(() => {
                const rc = getRemoteConfig(app);
                const val = getValue(rc, key);

                // Type casting based on default value type
                if (typeof defaultValue === 'boolean') {
                    setValue(val.asBoolean());
                } else if (typeof defaultValue === 'number') {
                    setValue(val.asNumber());
                } else {
                    setValue(val.asString());
                }
            });
        }
    }, [key, defaultValue]);

    return value;
};
