# Task: gen-func-reduce_product-1223 | Score: 100% | 2026-02-13T15:46:34.226719

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)