# Task: gen-list-count_positive-9023 | Score: 100% | 2026-02-15T08:06:06.932438

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))