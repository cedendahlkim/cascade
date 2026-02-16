# Task: gen-func-reduce_product-3447 | Score: 100% | 2026-02-13T14:09:48.293158

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)