# Task: gen-func-flatten-4260 | Score: 100% | 2026-02-13T21:08:32.205703

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))