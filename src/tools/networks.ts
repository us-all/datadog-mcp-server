import { z } from "zod/v4";
import { networkDevicesApi } from "../client.js";

export const listNetworkDevicesSchema = z.object({
  filterTag: z.string().optional().describe("Filter devices by tag. Example: env:production, datacenter:us-east"),
  sort: z.string().optional().describe("Sort field. Example: name, -name, model"),
  pageSize: z.coerce.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
});

export async function listNetworkDevices(params: z.infer<typeof listNetworkDevicesSchema>) {
  const response = await networkDevicesApi.listDevices({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
    sort: params.sort,
    filterTag: params.filterTag,
  });

  const devices = response.data ?? [];
  return {
    count: devices.length,
    totalCount: response.meta?.page?.totalFilteredCount,
    devices: devices.map((d) => ({
      id: d.id,
      type: d.type,
      attributes: d.attributes,
    })),
  };
}

export const getNetworkDeviceSchema = z.object({
  deviceId: z.string().describe("The device ID"),
});

export async function getNetworkDevice(params: z.infer<typeof getNetworkDeviceSchema>) {
  const response = await networkDevicesApi.getDevice({
    deviceId: params.deviceId,
  });

  const d = response.data;
  return {
    id: d?.id,
    type: d?.type,
    attributes: d?.attributes,
  };
}
