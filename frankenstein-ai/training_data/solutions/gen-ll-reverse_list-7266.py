# Task: gen-ll-reverse_list-7266 | Score: 100% | 2026-02-13T13:38:59.578115

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))