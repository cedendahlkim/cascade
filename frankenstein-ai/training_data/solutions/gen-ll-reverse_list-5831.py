# Task: gen-ll-reverse_list-5831 | Score: 100% | 2026-02-15T11:12:15.988925

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))