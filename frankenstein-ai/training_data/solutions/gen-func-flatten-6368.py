# Task: gen-func-flatten-6368 | Score: 100% | 2026-02-14T12:36:50.227583

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))