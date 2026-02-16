# Task: gen-algo-remove_duplicates-4729 | Score: 100% | 2026-02-10T15:41:25.212574

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

unique_nums = []
seen = set()

for num in nums:
  if num not in seen:
    unique_nums.append(num)
    seen.add(num)

print(*unique_nums)