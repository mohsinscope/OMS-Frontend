import { useState, useCallback } from "react";
import { message } from "antd";
import axiosInstance from './../../../../../intercepters/axiosInstance.js';

export default function useCascade() {
  const [ministryOptions,    setMinistries]   = useState([]);
  const [generalDirOptions,  setGenerals]     = useState([]);
  const [directorateOptions, setDirectorates] = useState([]);
  const [departmentOptions,  setDepartments]  = useState([]);
  const [sectionOptions,     setSections]     = useState([]);

  /* ───────── وزارة ───────── */
  const fetchMinistries = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/Ministry?PageNumber=1&PageSize=1000");
      setMinistries(data);
    } catch (error) {
      message.error("خطأ في تحميل قائمة الوزارات");
      console.error(error);
    }
  }, []);

  /* ───────── مديرية عامة ───────── */
  const fetchGeneralDirectorates = useCallback(async (ministryId) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/GeneralDirectorate/ByMinistry/${ministryId}`
      );
      setGenerals(data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.error("لا توجد مديرية عامة متصلة بهذه الوزارة");
      } else {
        message.error("خطأ في تحميل المديريات العامة");
        console.error(error);
      }
      setGenerals([]);
    }
  }, []);

  /* ───────── مديرية ───────── */
  const fetchDirectorates = useCallback(async (generalId) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/Directorate/ByGeneralDirectorate/${generalId}`
      );
      setDirectorates(data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.error("لا توجد مديرية متصلة بهذه المديرية العامة");
      } else {
        message.error("خطأ في تحميل المديريات");
        console.error(error);
      }
      setDirectorates([]);
    }
  }, []);

  /* ───────── قسم ───────── */
  const fetchDepartments = useCallback(async (dirId) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/Department/ByDirectorate/${dirId}`
      );
      setDepartments(data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.error("لا يوجد قسم متصل بهذه المديرية");
      } else {
        message.error("خطأ في تحميل الأقسام");
        console.error(error);
      }
      setDepartments([]);
    }
  }, []);

  /* ───────── شعبة ───────── */
  const fetchSections = useCallback(async (depId) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/Section/ByDepartment/${depId}`
      );
      setSections(data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.error("لا توجد شعبة متصله بهذا القسم");
      } else {
        message.error("خطأ في تحميل الشعب");
        console.error(error);
      }
      setSections([]);
    }
  }, []);

  return {
    ministryOptions,
    fetchMinistries,

    generalDirOptions,
    fetchGeneralDirectorates,

    directorateOptions,
    fetchDirectorates,

    departmentOptions,
    fetchDepartments,

    sectionOptions,
    fetchSections,

    resetBelow: (level) => {
      if (level === "ministry") setGenerals([]);
      if (["ministry", "general"].includes(level)) setDirectorates([]);
      if (["ministry", "general", "directorate"].includes(level))
        setDepartments([]);
      if (["ministry", "general", "directorate", "department"].includes(level))
        setSections([]);
    },
  };
}
