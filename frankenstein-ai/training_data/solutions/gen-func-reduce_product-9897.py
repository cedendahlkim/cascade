# Task: gen-func-reduce_product-9897 | Score: 100% | 2026-02-15T14:00:08.234443

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)