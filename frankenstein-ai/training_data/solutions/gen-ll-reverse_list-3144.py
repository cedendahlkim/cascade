# Task: gen-ll-reverse_list-3144 | Score: 100% | 2026-02-13T10:27:39.587034

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))