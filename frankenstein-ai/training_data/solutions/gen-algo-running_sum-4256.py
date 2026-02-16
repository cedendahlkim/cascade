# Task: gen-algo-running_sum-4256 | Score: 100% | 2026-02-12T12:32:02.617884

n = int(input())
sum_so_far = 0
result = []
for _ in range(n):
    num = int(input())
    sum_so_far += num
    result.append(str(sum_so_far))
print(" ".join(result))