# Task: gen-func-reduce_product-5813 | Score: 100% | 2026-02-13T13:39:18.969511

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)