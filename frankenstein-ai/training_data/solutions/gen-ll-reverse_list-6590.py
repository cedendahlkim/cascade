# Task: gen-ll-reverse_list-6590 | Score: 100% | 2026-02-13T12:27:09.784082

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))