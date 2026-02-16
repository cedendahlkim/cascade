# Task: gen-func-reduce_product-5118 | Score: 100% | 2026-02-13T11:43:01.944941

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)