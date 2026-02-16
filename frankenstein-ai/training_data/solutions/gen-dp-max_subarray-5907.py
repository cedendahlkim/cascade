# Task: gen-dp-max_subarray-5907 | Score: 100% | 2026-02-14T12:20:26.830095

n = int(input())
lst = [int(input()) for _ in range(n)]
max_sum = curr = lst[0]
for x in lst[1:]:
    curr = max(x, curr + x)
    max_sum = max(max_sum, curr)
print(max_sum)