# Task: gen-algo-remove_duplicates-1914 | Score: 100% | 2026-02-10T15:42:34.988610

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