# Task: gen-func-flatten-4842 | Score: 100% | 2026-02-10T15:45:26.014886

def flatten(lst):
    res = []
    for i in lst:
        if isinstance(i, list):
            res.extend(flatten(i))
        else:
            res.append(i)
    return res

import ast
input_list = ast.literal_eval(input())
flat_list = flatten(input_list)
print(*flat_list)