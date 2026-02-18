# Task: gen-func-flatten-3731 | Score: 100% | 2026-02-17T20:36:07.356263

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))