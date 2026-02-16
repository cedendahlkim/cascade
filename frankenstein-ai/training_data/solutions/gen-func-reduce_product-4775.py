# Task: gen-func-reduce_product-4775 | Score: 100% | 2026-02-13T09:26:04.287912

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)