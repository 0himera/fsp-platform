export const noCommentsPlugin = {
  rules: {
    "no-comments": {
      meta: {
        type: "problem",
        docs: {
          description: "Forbid all comments in code according to project rule",
        },
      },
      create(context) {
        return {
          Program() {
            const comments = context.sourceCode.getAllComments();
            for (const comment of comments) {
              context.report({
                loc: comment.loc,
                message: "Comments are strictly forbidden by project rules (no-comments.md).",
              });
            }
          },
        };
      },
    },
  },
};
