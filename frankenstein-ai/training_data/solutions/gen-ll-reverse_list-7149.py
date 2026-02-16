# Task: gen-ll-reverse_list-7149 | Score: 100% | 2026-02-15T11:12:15.702719

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))