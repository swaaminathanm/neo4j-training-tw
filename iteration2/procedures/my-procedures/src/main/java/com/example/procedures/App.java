package com.example.procedures;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.neo4j.graphdb.*;
import org.neo4j.graphdb.traversal.Evaluation;
import org.neo4j.graphdb.traversal.TraversalDescription;
import org.neo4j.procedure.*;

public class App {
    @Context
    public Transaction tx;

    @Procedure(value = "example.getCommonVariants", mode = Mode.READ)
    @Description("example.getCommonVariants({node1::Node, node2::Node})")
    public Stream<Result> getCommonVariants(@Name("param") final Map<String, Object> params) {
        try {
            Set<String> result = new HashSet<>();
            List<Node> nodes = new ArrayList<>();

            Node node1 = (Node) params.get("node1");
            Node node2 = (Node) params.get("node2");

            nodes.add(node1);
            nodes.add(node2);

            RelationshipType hasRelation = RelationshipType.withName("HAS");
            TraversalDescription td = tx.traversalDescription()
                    .breadthFirst()
                    .relationships(hasRelation, Direction.OUTGOING)
                    .evaluator(path -> {
                        if (path.endNode().hasLabel(Label.label("Variant"))) {
                            return Evaluation.INCLUDE_AND_PRUNE;
                        } else {
                            return Evaluation.EXCLUDE_AND_CONTINUE;
                        }
                    });

            for (final Node node : nodes) {
                Iterator<Path> pathIterator = td.traverse(node).iterator();
                Set<String> tempVariantsSet = new HashSet<>();
                while (pathIterator.hasNext()) {
                    String variantUuid = (String) pathIterator.next().endNode().getProperty("uuid");
                    tempVariantsSet.add(variantUuid);
                }
                if (result.isEmpty()) {
                    result.addAll(tempVariantsSet);
                } else {
                    result.retainAll(tempVariantsSet);
                }
            }

            return result.stream().map(Result::new);
        } catch (Exception ex) {
            ex.printStackTrace();
            throw ex;
        }
    }

    @Procedure(value = "example.getVariants", mode = Mode.READ)
    @Description("example.getVariants({node::Node})")
    public Stream<Result> getVariants(@Name("param") final Map<String, Object> params) {
        try {
            Node node = (Node) params.get("node");

            RelationshipType hasRelation = RelationshipType.withName("HAS");
            TraversalDescription td = tx.traversalDescription()
                    .breadthFirst()
                    .relationships(hasRelation, Direction.OUTGOING)
                    .evaluator(path -> {
                        if (path.endNode().hasLabel(Label.label("Variant"))) {
                            return Evaluation.INCLUDE_AND_PRUNE;
                        } else {
                            return Evaluation.EXCLUDE_AND_CONTINUE;
                        }
                    });

            Iterator<Path> iterator = td.traverse(node).iterator();
            Iterable<Path> iterable = () -> iterator;
            return StreamSupport.stream(iterable.spliterator(), false)
                    .map(Path::endNode)
                    .map(variant -> new Result((String) variant.getProperty("uuid")));
        } catch (Exception ex) {
            ex.printStackTrace();
            throw ex;
        }
    }

    public static class Result {
        public String variantUuid;

        public Result(String variantUuid) {
            this.variantUuid = variantUuid;
        }
    }
}
