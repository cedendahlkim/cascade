# Task: gen-func-flatten-2894 | Score: 100% | 2026-02-13T18:19:42.178418

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))