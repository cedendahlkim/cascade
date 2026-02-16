# Task: gen-ll-reverse_list-9887 | Score: 100% | 2026-02-13T11:54:46.491861

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))