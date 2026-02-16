# Task: gen-ds-reverse_with_stack-9440 | Score: 100% | 2026-02-13T18:35:04.932082

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))