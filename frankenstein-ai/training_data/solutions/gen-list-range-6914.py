# Task: gen-list-range-6914 | Score: 100% | 2026-02-13T14:01:35.076378

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))