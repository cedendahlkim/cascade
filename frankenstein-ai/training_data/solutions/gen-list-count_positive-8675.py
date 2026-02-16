# Task: gen-list-count_positive-8675 | Score: 100% | 2026-02-15T09:01:43.680619

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))