# Task: gen-func-reduce_product-2992 | Score: 100% | 2026-02-14T13:11:56.201972

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)