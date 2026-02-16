# Task: gen-list-count_positive-7860 | Score: 100% | 2026-02-13T14:01:22.340955

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))