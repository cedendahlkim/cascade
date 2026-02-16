# Task: gen-ll-reverse_list-7900 | Score: 100% | 2026-02-15T13:00:55.406040

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))