# Task: gen-func-reduce_product-7675 | Score: 100% | 2026-02-13T15:28:29.130039

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)