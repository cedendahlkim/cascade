# Task: gen-ds-reverse_with_stack-4255 | Score: 100% | 2026-02-13T14:56:43.029069

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))