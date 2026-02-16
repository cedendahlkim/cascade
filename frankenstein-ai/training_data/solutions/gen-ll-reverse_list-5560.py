# Task: gen-ll-reverse_list-5560 | Score: 100% | 2026-02-13T13:42:24.014607

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))