# Task: gen-func-reduce_product-8439 | Score: 100% | 2026-02-13T20:50:00.561148

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)