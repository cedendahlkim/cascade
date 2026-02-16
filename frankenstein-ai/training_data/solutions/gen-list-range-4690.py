# Task: gen-list-range-4690 | Score: 100% | 2026-02-13T09:34:12.153579

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))