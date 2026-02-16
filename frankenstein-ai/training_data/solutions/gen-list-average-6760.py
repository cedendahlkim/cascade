# Task: gen-list-average-6760 | Score: 100% | 2026-02-15T07:53:52.189647

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))