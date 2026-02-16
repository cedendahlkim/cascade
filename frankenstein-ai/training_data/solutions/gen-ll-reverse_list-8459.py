# Task: gen-ll-reverse_list-8459 | Score: 100% | 2026-02-14T12:20:18.920874

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))