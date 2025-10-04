"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { VideoEditor } from "@/components/stunts-app/VideoEditor";
import React from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  AuthToken,
  getSingleProject,
  saveSettingsData,
} from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { JwtData } from "@/hooks/useCurrentUser";
import { set } from "zod";
import { SavedState } from "@/engine/animations";
import { SaveTarget } from "@/engine/editor_state";
import { useTranslation } from "react-i18next";

export default function VideoStartupSettings() {
  const { t } = useTranslation("common");

  let [fileData, setFIleData] = React.useState<SavedState | null>(null);
  let [loading, setLoading] = React.useState(true);
  let [startupScreen, setStartupScreen] = React.useState(true);

  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const { projectId } = useParams();

  const [jwtData, saveJwtData] = useLocalStorage<JwtData | null>(
    "jwtData",
    null
  );

  let fetch_data = async () => {
    if (!authToken || fileData) {
      // If we already have fileData or no authToken, skip fetching
      console.info("No authToken or fileData already set, skipping fetch.");
      return;
    }

    // setLoading(true);

    let response = await getSingleProject(authToken.token, projectId as string);

    let data = response.project?.fileData;

    console.info("savedState", data);

    if (!data) {
      return;
    }

    console.info("response.project", response.project);

    setFIleData(data);

    if (data.settings?.dimensions.height && data.settings?.dimensions.width) {
      // dimensions already set
      console.info("dimensions already set", data.settings.dimensions);

      setStartupScreen(false);
      setLoading(false);
    } else {
      setStartupScreen(true);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetch_data();
  }, [authToken, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg">{t("Loading project")}...</p>
        </div>
      </div>
    );
  }

  if (startupScreen) {
    // Pick between horizontal 16:9 or vertical 9:16
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">
            {t("Choose your video orientation to get started")}:
          </p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={async () => {
                // Set dimensions for horizontal video
                let newSettings = fileData?.settings;
                if (!newSettings) {
                  newSettings = {
                    dimensions: {
                      width: 960,
                      height: 540,
                    },
                  };
                } else {
                  newSettings.dimensions = {
                    width: 960,
                    height: 540,
                  };
                }

                await saveSettingsData(newSettings, SaveTarget.Videos);

                setStartupScreen(false);
              }}
            >
              {t("Horizontal")} (16:9)
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={async () => {
                // Set dimensions for vertical video
                let newSettings = fileData?.settings;
                if (!newSettings) {
                  newSettings = {
                    dimensions: {
                      width: 540,
                      height: 960,
                    },
                  };
                } else {
                  newSettings.dimensions = {
                    width: 540,
                    height: 960,
                  };
                }

                await saveSettingsData(newSettings, SaveTarget.Videos);

                setStartupScreen(false);
              }}
              disabled={true}
            >
              {t("Vertical")} (9:16)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <VideoEditor projectId={projectId} />
    </div>
  );
}
