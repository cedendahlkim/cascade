# Task: gen-algo-running_sum-9368 | Score: 100% | 2026-02-12T12:42:38.634832

n = int(input())
sum_so_far = 0
result = []
for _ in range(n):
    num = int(input())
    sum_so_far += num
    result.append(str(sum_so_far))
print(" ".join(result))