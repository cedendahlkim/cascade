# Task: gen-func-flatten-1923 | Score: 100% | 2026-02-13T13:03:13.025956

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))