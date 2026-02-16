# Task: gen-func-flatten-6890 | Score: 100% | 2026-02-15T12:02:51.086074

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))