# Task: gen-ll-reverse_list-6996 | Score: 100% | 2026-02-13T15:11:04.861351

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))