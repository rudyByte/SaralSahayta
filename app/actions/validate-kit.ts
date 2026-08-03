'use server';

export async function validateKitCompleteness(
  requiredIds: string[],
  uploadedDocs: { id: string; status: string }[]
) {
  // Simulate network delay for server-side validation
  await new Promise(resolve => setTimeout(resolve, 800));

  const missing = requiredIds.filter(reqId => {
    const doc = uploadedDocs.find(d => d.id === reqId);
    return !doc || doc.status !== 'Validated';
  });

  if (missing.length > 0) {
    return {
      success: false,
      message: "Server Validation Failed: Please upload and validate all required documents before generating your Application Kit."
    };
  }

  return { success: true };
}
