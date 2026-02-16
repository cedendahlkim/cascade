# Task: gen-ll-detect_cycle_sim-8433 | Score: 100% | 2026-02-10T15:44:06.989822

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

seen = set()
for num in nums:
    if num in seen:
        print(num)
        break
    seen.add(num)