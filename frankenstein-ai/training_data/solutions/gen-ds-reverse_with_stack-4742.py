# Task: gen-ds-reverse_with_stack-4742 | Score: 100% | 2026-02-14T12:02:49.435984

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))